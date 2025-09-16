<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Buscar somente id, nome e cnpj
$sql = "SELECT id, nome, cnpj FROM companies WHERE parent_id IS NULL";
$stmt = $pdo->query($sql);
$companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retornar JSON
header('Content-Type: application/json');
echo json_encode($companies);

?>


