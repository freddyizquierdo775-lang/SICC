-- ==========================================
-- SCRIPT DE MIGRACIÓN: HERENCIA DE SUCURSALES (SaaS ERP)
-- Target: PostgreSQL / Supabase
-- ==========================================

-- 1. Agregar columna de Matriz y restricción de matriz única
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS es_matriz BOOLEAN DEFAULT false;

-- Índice parcial único para impedir que más de una sucursal tenga es_matriz = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_matriz_unica 
ON sucursales (es_matriz) 
WHERE (es_matriz = true);

-- Comentario regulatorio CNBV
COMMENT ON COLUMN sucursales.es_matriz IS 'Indica si la sucursal es la matriz regulada principal del centro cambiario.';


-- 2. Función de Herencia Automática (Triggers)
CREATE OR REPLACE FUNCTION heredar_datos_matriz()
RETURNS TRIGGER AS $$
DECLARE
    matriz_row RECORD;
BEGIN
    -- Si la nueva sucursal es secundaria (es_matriz = false o NULL)
    IF NEW.es_matriz = false OR NEW.es_matriz IS NULL THEN
        -- Buscar la sucursal matriz existente
        SELECT razon_social, rfc, licencia_cnbv 
        INTO matriz_row 
        FROM sucursales 
        WHERE es_matriz = true 
        LIMIT 1;
        
        -- Si existe la matriz, copiar automáticamente sus datos fiscales/regulatorios
        IF FOUND THEN
            NEW.razon_social := COALESCE(NEW.razon_social, matriz_row.razon_social);
            NEW.rfc := COALESCE(NEW.rfc, matriz_row.rfc);
            NEW.licencia_cnbv := COALESCE(NEW.licencia_cnbv, matriz_row.licencia_cnbv);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la herencia ANTES de insertar un registro
DROP TRIGGER IF EXISTS trigger_heredar_datos_matriz ON sucursales;
CREATE TRIGGER trigger_heredar_datos_matriz
BEFORE INSERT ON sucursales
FOR EACH ROW
EXECUTE FUNCTION heredar_datos_matriz();


-- 3. Políticas de Seguridad de Fila (RLS) para Supabase
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura para usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura para todos los usuarios autenticados" ON sucursales;
CREATE POLICY "Permitir lectura para todos los usuarios autenticados" 
ON sucursales FOR SELECT 
TO authenticated 
USING (true);

-- Política 2: Escritura/Modificación exclusiva para administradores
DROP POLICY IF EXISTS "Permitir escritura solo a administradores" ON sucursales;
CREATE POLICY "Permitir escritura solo a administradores" 
ON sucursales FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'email') IN ('freddyizquierdo775@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() ->> 'email') IN ('freddyizquierdo775@gmail.com')
);

-- 4. Función Auxiliar para Sincronización Global de Datos Fiscales
CREATE OR REPLACE FUNCTION propagar_datos_fiscales_matriz()
RETURNS INTEGER AS $$
DECLARE
    matriz_row RECORD;
    rows_updated INTEGER;
BEGIN
    -- Obtener datos fiscales de la matriz actual
    SELECT razon_social, rfc, licencia_cnbv 
    INTO matriz_row 
    FROM sucursales 
    WHERE es_matriz = true 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se puede propagar: no existe ninguna sucursal matriz configurada.';
    END IF;
    
    -- Actualizar todas las sucursales secundarias
    UPDATE sucursales 
    SET 
        razon_social = matriz_row.razon_social,
        rfc = matriz_row.rfc,
        licencia_cnbv = matriz_row.licencia_cnbv
    WHERE es_matriz = false OR es_matriz IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;
