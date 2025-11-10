package dev.agng.montron.pm.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"dev.agng.montron.pm", "dev.montron.pm"})
@EnableJpaRepositories(basePackages = {"dev.montron.pm"})
@EntityScan(basePackages = {"dev.montron.pm"})
public class BackendApplication {

        public static void main(String[] args) {
                SpringApplication.run(BackendApplication.class, args);
        }

}
