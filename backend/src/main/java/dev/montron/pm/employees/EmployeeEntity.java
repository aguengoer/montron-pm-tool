package dev.montron.pm.employees;

import dev.montron.pm.common.AbstractTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
        name = "employee",
        uniqueConstraints = {
            @UniqueConstraint(name = "ux_employee_company_username", columnNames = {"company_id", "username"})
        },
        indexes = {
            @Index(name = "idx_employee_company", columnList = "company_id"),
            @Index(name = "idx_employee_company_username", columnList = "company_id, username")
        }
)
public class EmployeeEntity extends AbstractTenantEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "username", nullable = false, length = 64)
    private String username;

    @Column(name = "first_name", length = 64)
    private String firstName;

    @Column(name = "last_name", length = 64)
    private String lastName;

    @Column(name = "department", length = 64)
    private String department;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "etag", length = 80)
    private String etag;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEtag() {
        return etag;
    }

    public void setEtag(String etag) {
        this.etag = etag;
    }
}
