package cn.gsjgsj.authzservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {"cn.gsjgsj.authzservice", "cn.gsjgsj.common"})
@EnableDiscoveryClient
public class AuthzServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthzServiceApplication.class, args);
    }

}
