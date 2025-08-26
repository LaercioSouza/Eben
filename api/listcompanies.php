<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// Conexão com o banco de dados
$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';


$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Consulta filtrada: apenas empresas que NÃO são filiais (parent_id IS NULL)
$sql = "SELECT id, nome, cnpj, endereco, telefone FROM companies WHERE parent_id IS NULL";
$stmt = $pdo->query($sql);
$empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retornar JSON
header('Content-Type: application/json');
echo json_encode($empresas);
?>