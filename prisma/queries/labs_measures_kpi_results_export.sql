SELECT
    c.name                                          AS `KPI Group`,
    kd.kpi_number                                   AS `KPI Number`,
    COALESCE(parent.name, kd.name)                  AS `KPI Name (parent)`,
    IF(kd.parent_kpi_id IS NOT NULL, kd.name, '')   AS `KPI subtitle (child)`,
    tm.name                                         AS `Transport Mode (modal split)`,
    kd.metric                                       AS `Metric(unit)`,
    l.name                                          AS `Living Lab`,
    kr.value                                        AS `KPI result value`,
    DATE_FORMAT(kr.date, '%Y-%m-%d')                AS `KPI result date`,
    p.name                                       AS `Policy measure`,
    p.type                                          AS `Policy type`

FROM kpiresults kr

JOIN kpidefinitions kd
    ON kd.id = kr.kpidefinition_id

LEFT JOIN kpidefinitions parent
    ON parent.id = kd.parent_kpi_id

LEFT JOIN kpidefinitions_category kdc
    ON kdc.kpidefinition_id = kd.id

LEFT JOIN categories c
    ON c.id = kdc.category_id

JOIN labs l
    ON l.id = kr.living_lab_id

LEFT JOIN transport_mode tm
    ON tm.id = kr.transport_mode_id

LEFT JOIN living_lab_projects_implementation ll_p
    ON ll_p.living_lab_id = l.id

INNER JOIN projects p
    ON p.id = ll_p.project_id

ORDER BY
    l.name,
    kd.kpi_number,
    kr.date,
    p.name;