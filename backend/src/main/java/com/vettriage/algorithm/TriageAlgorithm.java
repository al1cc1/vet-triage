package com.vettriage.algorithm;

import com.vettriage.model.TriageCategory;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class TriageAlgorithm {

    private static final Map<TriageCategory, Integer> BASE_MINUTES = Map.of(
        TriageCategory.RED,    1,
        TriageCategory.ORANGE, 10,
        TriageCategory.YELLOW, 30,
        TriageCategory.GREEN,  60
    );

    private static final List<String> RED_KEYWORDS = List.of(
        "drgawki", "utrata przytomności", "brak oddechu", "wstrząs", "niedrożność moczowa"
    );
    private static final List<String> ORANGE_KEYWORDS = List.of(
        "krwotok", "silny ból", "uraz", "trudności oddechowe"
    );
    private static final List<String> YELLOW_KEYWORDS = List.of(
        "wymioty", "kulawizna", "gorączka", "brak apetytu"
    );
    private static final List<String> GREEN_KEYWORDS = List.of(
        "szczepienie", "kontrola", "pielęgnacja"
    );

    public TriageCategory calculateCategory(List<String> symptoms) {
        String combined = String.join(" ", symptoms).toLowerCase();

        if (containsAny(combined, RED_KEYWORDS))    return TriageCategory.RED;
        if (containsAny(combined, ORANGE_KEYWORDS)) return TriageCategory.ORANGE;
        if (containsAny(combined, YELLOW_KEYWORDS)) return TriageCategory.YELLOW;
        return TriageCategory.GREEN;
    }

    public int calculateWaitingTime(TriageCategory category, LocalDateTime dateTime) {
        if (category == TriageCategory.RED) return 1;

        int base = BASE_MINUTES.get(category);
        double multiplier = 1.0;
        int hour = dateTime.getHour();
        LocalDate date = dateTime.toLocalDate();
        Month month = date.getMonth();

        if (hour >= 7 && hour < 10)  multiplier += 0.20;
        if (hour >= 17 && hour < 20) multiplier += 0.15;

        if (month == Month.JULY || month == Month.AUGUST) multiplier += 0.25;

        if (month == Month.MARCH   || month == Month.APRIL ||
            month == Month.OCTOBER || month == Month.NOVEMBER) multiplier += 0.10;

        if (isHoliday(date)) multiplier += 0.35;

        if (date.getDayOfWeek() == DayOfWeek.MONDAY) multiplier += 0.15;

        return (int) Math.round(base * multiplier);
    }

    private boolean isHoliday(LocalDate date) {
        int day   = date.getDayOfMonth();
        int month = date.getMonthValue();

        // Christmas 24-26.12
        if (month == 12 && day >= 24 && day <= 26) return true;

        // New Year's Eve / New Year
        if (month == 12 && day == 31) return true;
        if (month == 1  && day == 1)  return true;

        // Easter ±2 days
        LocalDate easter = calculateEaster(date.getYear());
        long diff = Math.abs(date.toEpochDay() - easter.toEpochDay());
        return diff <= 2;
    }

    // Meeus/Jones/Butcher algorithm
    private LocalDate calculateEaster(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int easterMonth = (h + l - 7 * m + 114) / 31;
        int easterDay   = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(year, easterMonth, easterDay);
    }

    private boolean containsAny(String text, List<String> keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }
}
