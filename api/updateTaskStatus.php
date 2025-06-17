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
$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Preparar query baseada no tipo de atualização
    if ($data['newStatus'] === 'em_translado') {
        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                transitStartedAt = :transitStartedAt
                              WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => $data['newStatus'],
            ':transitStartedAt' => $data['startTime'],
            ':taskId' => $data['taskId']
        ]);
    } 
    elseif ($data['newStatus'] === 'aguardando_inicio') {
        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                transit_end = :endTime,
                                arrival_coordinates = :coordinates
                              WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => $data['newStatus'],
            ':endTime' => $data['endTime'],
            ':coordinates' => $data['coordinates'],
            ':taskId' => $data['taskId']
        ]);
    }
    // Adicione outros casos conforme necessário

 

    echo json_encode(['success' => true, 'message' => 'Status atualizado']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>