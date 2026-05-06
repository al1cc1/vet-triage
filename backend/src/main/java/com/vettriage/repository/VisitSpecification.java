package com.vettriage.repository;

import com.vettriage.model.TriageCategory;
import com.vettriage.model.Visit;
import com.vettriage.model.VisitStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class VisitSpecification {

    private static final List<String> KNOWN_SPECIES = List.of("pies", "kot", "królik");

    public static Specification<Visit> build(UUID clinicId, LocalDate dateFrom, LocalDate dateTo,
                                              List<TriageCategory> categories, String species,
                                              VisitStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("clinic").get("id"), clinicId));

            if (dateFrom != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            if (dateTo != null)
                predicates.add(cb.lessThan(root.get("createdAt"), dateTo.plusDays(1).atStartOfDay()));

            if (categories != null && !categories.isEmpty())
                predicates.add(root.get("triageCategory").in(categories));

            if (status != null)
                predicates.add(cb.equal(root.get("status"), status));

            if (species != null && !species.isBlank()) {
                var speciesPath = cb.lower(root.get("animal").get("species"));
                if ("inne".equalsIgnoreCase(species)) {
                    for (String known : KNOWN_SPECIES)
                        predicates.add(cb.notLike(speciesPath, "%" + known + "%"));
                } else {
                    predicates.add(cb.like(speciesPath, "%" + species.toLowerCase() + "%"));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
