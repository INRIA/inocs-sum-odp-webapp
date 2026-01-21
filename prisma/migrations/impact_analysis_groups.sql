
INSERT INTO categories (name, type ) VALUES ("Improve Safety", "MCDA_GOALS");
INSERT INTO categories (name, type ) VALUES ("Improve Public Transport", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Improve Accessibility", "MCDA_GOALS");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Safety" 
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ( "12.1.1", "12.1.2", "12.1.3", "12.2.1", "12.2.2", "12.2.3", "13");



INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Public Transport"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN (
"7.1",
"7.2",
"7.3",
"7.4",
"7.5",
"7.6",
"7.7",
"11.1.1",
"11.1.2",
"11.1.3",
"11.2.1",
"11.2.2",
"11.2.3",
"14");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Accessibility"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("1", "5", "6.1", "6.2", "6.3", "20");



SET GLOBAL sort_buffer_size=8388608;
SHOW VARIABLES WHERE Variable_name IN ('sort_buffer_size','read_rnd_buffer_size','tmp_table_size','max_heap_table_size','max_sort_length');

SET PERSIST sort_buffer_size=8388608; 