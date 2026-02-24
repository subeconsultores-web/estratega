<#
.SYNOPSIS
Script para instalar masivamente las extensiones necesarias de Firestore BigQuery Export para Analytics.

.DESCRIPTION
Debido a que BigQuery requiere confirmación de habilitación de Billing en GCP, debes ejecutar esto en tu terminal o instalar las extensiones individualmente desde la consola de Firebase.

.EXAMPLE
./instalar-extensiones-bq.ps1
#>

Write-Host "Iniciando instalación de Firebase Extension: Firestore BigQuery Export" -ForegroundColor Cyan
Write-Host "Se te pedirán permisos de facturación (Billing) y la región para cada colección." -ForegroundColor Yellow

$colecciones = @("clientes", "proyectos", "cotizaciones", "facturas")
$datasetId = "firestore_export"

foreach ($col in $colecciones) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "Instalando BigQuery Export para la colección: $col" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    
    # El comando pedirá interactivamente los datos. Se recomienda usar:
    # DATASET_ID = firestore_export
    # TABLE_ID = <nombre_coleccion>
    # LOCATION = us-central1 o tu región preferida
    
    firebase ext:install firebase/firestore-bigquery-export --project default
}

Write-Host "¡Proceso de instalaciones finalizado! Revisa tu Google Cloud Console (BigQuery) para ver los Datasets creados." -ForegroundColor Cyan
