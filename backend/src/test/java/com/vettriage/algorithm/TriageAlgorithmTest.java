package com.vettriage.algorithm;

import com.vettriage.model.TriageCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TriageAlgorithmTest {

    private TriageAlgorithm algorithm;

    // Neutral: Thursday 2025-06-12, 12:00 — no peak, no season, not Monday, not holiday
    private static final LocalDateTime NEUTRAL = LocalDateTime.of(2025, 6, 12, 12, 0);

    @BeforeEach
    void setUp() {
        algorithm = new TriageAlgorithm();
    }

    // -------------------------------------------------------------------------
    // calculateCategory
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateCategory — RED keywords")
    class RedCategoryTests {

        @Test void seizures()           { assertCategory(List.of("drgawki"),              TriageCategory.RED); }
        @Test void unconscious()        { assertCategory(List.of("utrata przytomności"),  TriageCategory.RED); }
        @Test void noBreathing()        { assertCategory(List.of("brak oddechu"),         TriageCategory.RED); }
        @Test void shock()              { assertCategory(List.of("wstrząs"),              TriageCategory.RED); }
        @Test void urinaryObstruction() { assertCategory(List.of("niedrożność moczowa"), TriageCategory.RED); }
    }

    @Nested
    @DisplayName("calculateCategory — ORANGE keywords")
    class OrangeCategoryTests {

        @Test void hemorrhage()          { assertCategory(List.of("krwotok"),             TriageCategory.ORANGE); }
        @Test void severePain()          { assertCategory(List.of("silny ból"),           TriageCategory.ORANGE); }
        @Test void trauma()              { assertCategory(List.of("uraz"),                TriageCategory.ORANGE); }
        @Test void breathingDifficulty() { assertCategory(List.of("trudności oddechowe"), TriageCategory.ORANGE); }
    }

    @Nested
    @DisplayName("calculateCategory — YELLOW keywords")
    class YellowCategoryTests {

        @Test void vomiting()   { assertCategory(List.of("wymioty"),      TriageCategory.YELLOW); }
        @Test void lameness()   { assertCategory(List.of("kulawizna"),    TriageCategory.YELLOW); }
        @Test void fever()      { assertCategory(List.of("gorączka"),     TriageCategory.YELLOW); }
        @Test void noAppetite() { assertCategory(List.of("brak apetytu"), TriageCategory.YELLOW); }
    }

    @Nested
    @DisplayName("calculateCategory — GREEN (default)")
    class GreenCategoryTests {

        @Test void vaccination() { assertCategory(List.of("szczepienie"), TriageCategory.GREEN); }
        @Test void checkup()     { assertCategory(List.of("kontrola"),    TriageCategory.GREEN); }
        @Test void grooming()    { assertCategory(List.of("pielęgnacja"), TriageCategory.GREEN); }
        @Test void noSymptoms()  { assertCategory(List.of(),              TriageCategory.GREEN); }
    }

    @Nested
    @DisplayName("calculateCategory — priority: RED > ORANGE > YELLOW > GREEN")
    class PriorityTests {

        @Test
        void redBeatsOrange() {
            assertCategory(List.of("drgawki", "krwotok"), TriageCategory.RED);
        }

        @Test
        void orangeBeatsYellow() {
            assertCategory(List.of("uraz", "wymioty"), TriageCategory.ORANGE);
        }

        @Test
        void yellowBeatsGreen() {
            assertCategory(List.of("gorączka", "kontrola"), TriageCategory.YELLOW);
        }
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — base minutes
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — base minutes (neutral datetime)")
    class BaseMinutesTests {

        @Test void redAlwaysReturns1() { assertWait(TriageCategory.RED,    NEUTRAL, 1);  }
        @Test void orangeBaseIs10()    { assertWait(TriageCategory.ORANGE, NEUTRAL, 10); }
        @Test void yellowBaseIs30()    { assertWait(TriageCategory.YELLOW, NEUTRAL, 30); }
        @Test void greenBaseIs60()     { assertWait(TriageCategory.GREEN,  NEUTRAL, 60); }
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — time-of-day multipliers
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — morning peak 07:00–09:59 (+20%)")
    class MorningPeakTests {

        // Thursday 2025-06-12 — no other multipliers active
        @Test void at7appliesMultiplier()  { assertWait(TriageCategory.ORANGE, dt(2025,6,12, 7,0), 12); } // 10*1.20
        @Test void at9appliesMultiplier()  { assertWait(TriageCategory.GREEN,  dt(2025,6,12, 9,0), 72); } // 60*1.20
        @Test void at10noMultiplier()      { assertWait(TriageCategory.GREEN,  dt(2025,6,12,10,0), 60); } // 10 not < 10
        @Test void at6noMultiplier()       { assertWait(TriageCategory.GREEN,  dt(2025,6,12, 6,0), 60); }
        @Test void redIgnoresMorningPeak() { assertWait(TriageCategory.RED,    dt(2025,6,12, 8,0),  1); }
    }

    @Nested
    @DisplayName("calculateWaitingTime — evening peak 17:00–19:59 (+15%)")
    class EveningPeakTests {

        @Test void at17appliesMultiplier()  { assertWait(TriageCategory.ORANGE, dt(2025,6,12,17,0), 12); } // 10*1.15=11.5→12
        @Test void at19appliesMultiplier()  { assertWait(TriageCategory.GREEN,  dt(2025,6,12,19,0), 69); } // 60*1.15
        @Test void at20noMultiplier()       { assertWait(TriageCategory.GREEN,  dt(2025,6,12,20,0), 60); }
        @Test void at16noMultiplier()       { assertWait(TriageCategory.GREEN,  dt(2025,6,12,16,0), 60); }
        @Test void redIgnoresEveningPeak()  { assertWait(TriageCategory.RED,    dt(2025,6,12,18,0),  1); }
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — seasonal multipliers
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — summer July/August (+25%)")
    class SummerTests {

        // Wed 2025-07-09 and Wed 2025-08-06 — no other multipliers
        @Test void july()   { assertWait(TriageCategory.YELLOW, dt(2025,7,9, 12,0), 38); } // 30*1.25=37.5→38
        @Test void august() { assertWait(TriageCategory.GREEN,  dt(2025,8,6, 12,0), 75); } // 60*1.25
    }

    @Nested
    @DisplayName("calculateWaitingTime — spring/autumn Mar/Apr/Oct/Nov (+10%)")
    class SpringAutumnTests {

        // All Wednesdays, no other multipliers active
        @Test void march()    { assertWait(TriageCategory.YELLOW,  dt(2025, 3, 5,12,0), 33); } // 30*1.10
        @Test void april()    { assertWait(TriageCategory.YELLOW,  dt(2025, 4, 9,12,0), 33); } // not near Easter
        @Test void october()  { assertWait(TriageCategory.GREEN,   dt(2025,10, 8,12,0), 66); } // 60*1.10
        @Test void november() { assertWait(TriageCategory.ORANGE,  dt(2025,11, 5,12,0), 11); } // 10*1.10
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — holiday multiplier (+35%)
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — holiday (+35%)")
    class HolidayTests {

        // Wed 2025-12-24 — December has no seasonal multiplier
        @Test void christmas24() { assertWait(TriageCategory.GREEN,  dt(2025,12,24,12,0), 81); } // 60*1.35
        // Thu 2025-12-25
        @Test void christmas25() { assertWait(TriageCategory.ORANGE, dt(2025,12,25,12,0), 14); } // 10*1.35=13.5→14
        // Thu 2025-12-26
        @Test void christmas26() { assertWait(TriageCategory.GREEN,  dt(2025,12,26,12,0), 81); }
        // Wed 2025-12-31
        @Test void newYearEve()  { assertWait(TriageCategory.GREEN,  dt(2025,12,31,12,0), 81); }
        // Thu 2026-01-01
        @Test void newYear()     { assertWait(TriageCategory.GREEN,  dt(2026, 1, 1,12,0), 81); }

        // Easter 2025 = 20 April (Sunday), ±2 days → 18–22 April; April is also +10%
        // GREEN: 60 * (1.0 + 0.35 + 0.10) = 87
        @Test void easterFriday() { assertWait(TriageCategory.GREEN, dt(2025,4,18,12,0), 87); }
        @Test void easterSunday() { assertWait(TriageCategory.GREEN, dt(2025,4,20,12,0), 87); }
        // Easter Monday is also a calendar Monday → holiday +35% + April +10% + Monday +15% = 1.60
        @Test void easterMonday() { assertWait(TriageCategory.GREEN, dt(2025,4,21,12,0), 96); } // 60*1.60

        @Test void redIgnoresHoliday() { assertWait(TriageCategory.RED, dt(2025,12,25,12,0), 1); }
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — Monday multiplier (+15%)
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — Monday (+15%)")
    class MondayTests {

        // Mon 2025-06-16 — neutral month, neutral hour
        @Test void mondayOrange() { assertWait(TriageCategory.ORANGE, dt(2025,6,16,12,0), 12); } // 10*1.15=11.5→12
        @Test void mondayYellow() { assertWait(TriageCategory.YELLOW, dt(2025,6,16,12,0), 35); } // 30*1.15=34.5→35
        @Test void mondayGreen()  { assertWait(TriageCategory.GREEN,  dt(2025,6,16,12,0), 69); } // 60*1.15
        @Test void redIgnoresMonday() { assertWait(TriageCategory.RED, dt(2025,6,16,12,0), 1); }
    }

    // -------------------------------------------------------------------------
    // calculateWaitingTime — combined multipliers
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("calculateWaitingTime — combined multipliers")
    class CombinedTests {

        @Test
        @DisplayName("Monday + morning peak + summer (July) → GREEN = 96")
        void mondayMorningPeakSummer() {
            // Mon 2025-07-07, 08:00 → 1.0 + 0.15 + 0.20 + 0.25 = 1.60
            assertWait(TriageCategory.GREEN, dt(2025,7,7, 8,0), 96); // 60*1.60
        }

        @Test
        @DisplayName("Holiday (Christmas) + evening peak → GREEN = 90")
        void holidayEveningPeak() {
            // Wed 2025-12-24, 18:00 → 1.0 + 0.35 + 0.15 = 1.50
            assertWait(TriageCategory.GREEN, dt(2025,12,24,18,0), 90); // 60*1.50
        }

        @Test
        @DisplayName("Monday + spring + morning peak → YELLOW = 44")
        void mondaySpringMorning() {
            // Mon 2025-03-03, 08:00 → 1.0 + 0.15 + 0.10 + 0.20 = 1.45
            assertWait(TriageCategory.YELLOW, dt(2025,3,3, 8,0), 44); // 30*1.45=43.5→44
        }

        @Test
        @DisplayName("RED ignores all multipliers even when stacked")
        void redIgnoresAllMultipliers() {
            // Mon July, morning peak — still 1
            assertWait(TriageCategory.RED, dt(2025,7,7, 8,0), 1);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void assertCategory(List<String> symptoms, TriageCategory expected) {
        assertThat(algorithm.calculateCategory(symptoms)).isEqualTo(expected);
    }

    private void assertWait(TriageCategory category, LocalDateTime dt, int expectedMinutes) {
        assertThat(algorithm.calculateWaitingTime(category, dt)).isEqualTo(expectedMinutes);
    }

    private static LocalDateTime dt(int year, int month, int day, int hour, int minute) {
        return LocalDateTime.of(year, month, day, hour, minute);
    }
}
