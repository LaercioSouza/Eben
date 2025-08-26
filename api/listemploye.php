<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';


$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Buscar somente id e nome de usuários normais (tipo 2)
$sql = "SELECT id, nome FROM employees WHERE tipe_user = 2";
$stmt = $pdo->query($sql);
$funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retornar JSON
echo json_encode($funcionarios);

?>