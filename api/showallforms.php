<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Consulta 1: Total de formulários
$stmtTotal = $pdo->query("SELECT COUNT(*) AS total FROM form");
$total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];

// Consulta 2: Dados dos formulários
$stmtData = $pdo->query("SELECT * FROM form");
$forms = $stmtData->fetchAll(PDO::FETCH_ASSOC);

// Resposta final
echo json_encode([
    'total' => $total,
    'formularios' => $forms
]);

?>