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

$sql = "
   SELECT 
        e.nome AS empresa,
        c.nome AS colaborador,
        t.id,
        t.data_tarefa,
        t.hora_tarefa,
        t.status
    FROM 
        task t
    JOIN 
        companies e ON t.empresa_id = e.id
    JOIN 
        employees c ON t.colaborador_id = c.id


";

// Prepara e executa
$stmt = $pdo->prepare($sql);
$stmt->execute();

// Busca os dados
$resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retorna como JSON
echo json_encode($resultados);

/*
// Buscar somente id e nome
$sql = "SELECT id, nome FROM employees";
$stmt = $pdo->query($sql);
$funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retornar JSON
header('Content-Type: application/json');
echo json_encode($funcionarios);
*/

?>




