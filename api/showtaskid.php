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

// Receber JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Validar se os dados existem

if (!isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID não fornecido']);
    exit;
}

$sql = "SELECT 
    e.nome AS empresa,
    c.nome AS colaborador,
    t.id,
    t.data_tarefa,
    t.hora_tarefa,
    t.status,
    t.tempo_sugerido,
    t.responsavel,
    t.descricao,
    t.formulario_id,
    t.transitTime,
    t.workTime, 
    t.pauseTime, 
    t.returnTransitTime, 
    t.observations, 
    t.completionObservations, 
    t.finalObservations
 FROM 
    task t
 JOIN 
    companies e ON t.empresa_id = e.id
 JOIN 
    employees c ON t.colaborador_id = c.id
 WHERE
    t.id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute([':id' => $data['id']]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($result);

?>




