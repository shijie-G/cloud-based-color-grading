/**
 * .gsj 文件加密/解密
 *
 * 两轮加密流程（导出）：
 *   明文 JSON
 *     → Round 1: AES-GCM  (随机 IV 12B，认证加密，防篡改)
 *     → Round 2: AES-CBC  (随机 IV 16B，增加扩散混淆)
 *     → 最终二进制: [magic(3B)] [r1_iv(12B)] [r2_iv(16B)] [ciphertext]
 *
 * 解密时逆序：AES-CBC 解密 → AES-GCM 解密 → 明文 JSON
 *
 * 密钥派生：PBKDF2-SHA256，100_000 次迭代，固定 salt（文件格式绑定）
 * 两轮使用不同的 key（同一 passphrase 派生两条独立密钥）
 */

const PASSPHRASE = 'GSJ-WORKSTATION-2025-SECRET'
const SALT_R1 = new TextEncoder().encode('gsj-round1-aes-gcm-salt-v1')
const SALT_R2 = new TextEncoder().encode('gsj-round2-aes-cbc-salt-v1')
const PBKDF2_ITER = 100_000

const MAGIC = new Uint8Array([0x47, 0x53, 0x4a])  // "GSJ"

// ── 密钥派生 ──────────────────────────────────────────────────

async function deriveKey(salt: Uint8Array, algorithm: 'AES-GCM' | 'AES-CBC'): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    baseKey,
    { name: algorithm, length: 256 },
    false,
    algorithm === 'AES-GCM' ? ['encrypt', 'decrypt'] : ['encrypt', 'decrypt'],
  )
}

// ── 工具 ──────────────────────────────────────────────────────

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}

// ── 加密（两轮） ──────────────────────────────────────────────

/**
 * 将明文 JSON 字符串加密为二进制 Uint8Array
 */
export async function encrypt(plaintext: string): Promise<Uint8Array> {
  const [keyR1, keyR2] = await Promise.all([
    deriveKey(SALT_R1, 'AES-GCM'),
    deriveKey(SALT_R2, 'AES-CBC'),
  ])

  // Round 1: AES-GCM
  const iv1 = crypto.getRandomValues(new Uint8Array(12))
  const r1 = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv1 },
      keyR1,
      new TextEncoder().encode(plaintext),
    )
  )

  // Round 2: AES-CBC（输入需对齐 16B）
  const iv2 = crypto.getRandomValues(new Uint8Array(16))
  // AES-CBC 要求输入长度是 16 的倍数，手动 PKCS#7 padding
  const padLen = 16 - (r1.length % 16)
  const padded = concat(r1, new Uint8Array(padLen).fill(padLen))
  const r2 = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv2 },
      keyR2,
      padded,
    )
  )

  // 最终格式: [magic(3)] [iv1(12)] [iv2(16)] [ciphertext]
  return concat(MAGIC, iv1, iv2, r2)
}

// ── 解密（逆序两轮） ──────────────────────────────────────────

/**
 * 将加密二进制还原为明文 JSON 字符串
 */
export async function decrypt(data: Uint8Array): Promise<string> {
  // 校验 magic
  if (data[0] !== MAGIC[0] || data[1] !== MAGIC[1] || data[2] !== MAGIC[2]) {
    throw new Error('GSJ 文件 magic 校验失败，可能不是有效的加密文件')
  }

  const iv1 = data.slice(3, 15)        // 12B
  const iv2 = data.slice(15, 31)       // 16B
  const ciphertext = data.slice(31)    // 剩余

  const [keyR1, keyR2] = await Promise.all([
    deriveKey(SALT_R1, 'AES-GCM'),
    deriveKey(SALT_R2, 'AES-CBC'),
  ])

  // 逆 Round 2: AES-CBC 解密
  const padded = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv2 },
      keyR2,
      ciphertext,
    )
  )

  // 去除 PKCS#7 padding
  const padLen = padded[padded.length - 1]
  const r1 = padded.slice(0, padded.length - padLen)

  // 逆 Round 1: AES-GCM 解密（同时验证完整性）
  const plainBytes = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv1 },
      keyR1,
      r1,
    )
  )

  return new TextDecoder().decode(plainBytes)
}
