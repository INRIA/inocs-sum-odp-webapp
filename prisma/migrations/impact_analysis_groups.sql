
INSERT INTO categories (name, type ) VALUES ("Improve Safety", "MCDA_GOALS");
INSERT INTO categories (name, type ) VALUES ("Improve Public Transport", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Improve Accessibility", "MCDA_GOALS");

INSERT INTO categories (name, type) VALUES ("Reduction of Congestion", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Reduction of Emission", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Noise Hinderance", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Improve Mobility Service", "MCDA_GOALS");
INSERT INTO categories (name, type) VALUES ("Improve Multimodality", "MCDA_GOALS");

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
"14",
"25");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Accessibility"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("5", "6.1", "6.2", "6.3", "20");


INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Reduction of Congestion"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("24");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Reduction of Emission"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("16","19");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Noise Hinderance"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("18");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Mobility Service"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("1","13","8");

INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Improve Multimodality"
  AND c.type = "MCDA_GOALS"
  AND k.kpi_number IN ("7", "10","10.1.1","10.1.2","10.1.3", "10.2.1", "10.2.2", "10.3.1", "10.3.2", "10.3.3","10.4.1","10.4.2", "9");

SET GLOBAL sort_buffer_size=8388608;
SHOW VARIABLES WHERE Variable_name IN ('sort_buffer_size','read_rnd_buffer_size','tmp_table_size','max_heap_table_size','max_sort_length');

SET PERSIST sort_buffer_size=8388608; 


INSERT INTO categories (name, type) VALUES ("Modal Split", "KPI_SIEF");
INSERT INTO kpidefinitions_category (category_id, kpidefinition_id )
SELECT c.id, k.id 
FROM categories c
CROSS JOIN kpidefinitions k
WHERE c.name = "Modal Split"
  AND c.type = "KPI_SIEF"
  AND k.kpi_number IN ("15", "15.a", "15.b", "15.c");
