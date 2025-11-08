package dev.montron.pm.pdf;

import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.workday.RsEntryEntity;
import dev.montron.pm.workday.TbEntryEntity;
import dev.montron.pm.workday.WorkdayEntity;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;

@Service
public class PdfService {

    public byte[] generateTbPdf(WorkdayEntity workday, TbEntryEntity tb, EmployeeEntity employee) {
        String content = "TB PDF\n"
                + "Employee: " + employee.getLastName() + ", " + employee.getFirstName() + "\n"
                + "Date: " + workday.getWorkDate() + "\n"
                + "Start: " + tb.getStartTime() + "\n"
                + "End: " + tb.getEndTime() + "\n"
                + "Break: " + tb.getBreakMinutes();
        return content.getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateRsPdf(WorkdayEntity workday, RsEntryEntity rs, EmployeeEntity employee) {
        String content = "RS PDF\n"
                + "Employee: " + employee.getLastName() + ", " + employee.getFirstName() + "\n"
                + "Date: " + workday.getWorkDate() + "\n"
                + "Customer: " + rs.getCustomerName() + "\n"
                + "Start: " + rs.getStartTime() + "\n"
                + "End: " + rs.getEndTime();
        return content.getBytes(StandardCharsets.UTF_8);
    }
}
