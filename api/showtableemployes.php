<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Buscar todos os dados de usuários normais (tipo 2)
$sql = "SELECT * FROM employees WHERE tipe_user = 2";
$stmt = $pdo->query($sql);
$funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retornar JSON
echo json_encode($funcionarios);

?>