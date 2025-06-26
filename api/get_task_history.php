<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// salvar.php

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Receber JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Validar se os dados existem
if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes!']);
  exit;
}

$sql = "
SELECT 'criado' AS action, t.criado_em AS timestamp, t.coordenadas AS coordinates, NULL AS observations, NULL AS reason
FROM task t
WHERE t.id = :taskId

UNION ALL
SELECT 'inicio_translado', t.transitStartedAt, t.transitStartLocation, NULL, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'fim_translado', t.transitEndAt, t.transitEndLocation, NULL, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'inicio_tarefa', t.taskStartedAt, t.startLocation, NULL, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'conclusao_tarefa', t.completedAt, t.locationEndTask, t.completionObservations, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'inicio_retorno', t.returnStartedAt, t.returnStartLocation, NULL, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'fim_retorno', t.ReturnEndAt, t.returnEndLocation, NULL, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'finalizada', t.finalizedAt, NULL, t.finalObservations, NULL FROM task t WHERE t.id = :taskId
UNION ALL
SELECT 'pausa', tp.started_at, tp.location, NULL, tp.reason FROM task_pauses tp WHERE tp.task_id = :taskId
UNION ALL
SELECT 'retomada', tp.ended_at, tp.endLocation, NULL, NULL FROM task_pauses tp WHERE tp.task_id = :taskId
ORDER BY timestamp ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':taskId' => $data['id']]);
$history = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["history" => $history]);




?>