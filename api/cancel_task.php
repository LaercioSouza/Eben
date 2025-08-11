<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';
date_default_timezone_set('America/Sao_Paulo');

try {
    $input = json_decode(file_get_contents("php://input"), true);
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '-03:00'");

    // Iniciar transação
    $pdo->beginTransaction();
    
    $taskId      = $input['taskId'] ?? null;
    $newStatus   = $input['newStatus'] ?? null;
    $endTime     = $input['endTime'] ?? null;
    $coordinates = $input['coordinates'] ?? null;
    $reason      = $input['Reason'] ?? null;
    $photoBase64 = $input['photo'] ?? null;

    if (!$taskId || !$reason) {
        echo json_encode(["success" => false, "message" => "Dados insuficientes."]);
        exit;
    }
    /*
    // Diretório para salvar fotos
    $uploadDir = __DIR__ . "/uploads/cancellations/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $photoFileName = null;
    if ($photoBase64) {
        // Remove prefixo "data:image/jpeg;base64,"
        $photoBase64 = preg_replace('#^data:image/\w+;base64,#i', '', $photoBase64);
        $photoData = base64_decode($photoBase64);

        if ($photoData !== false) {
            $photoFileName = "cancel_" . $taskId . "_" . time() . ".jpg";
            file_put_contents($uploadDir . $photoFileName, $photoData);
        }
    }
        */

    // Monta o SQL de update
    $sql = "UPDATE task 
            SET 
                status = :status,
                cancellation_timestamp = :endTime,
                cancellation_reason = :reason,
                cancellation_coordinates = :coordinates
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(":status", $newStatus);
    $stmt->bindValue(":endTime", $endTime ?: date('Y-m-d H:i:s')); // Se não vier, usa hora do servidor
    $stmt->bindValue(":reason", $reason);
    $stmt->bindValue(":coordinates", $coordinates);
    $stmt->bindValue(":id", $taskId);

    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Tarefa cancelada com sucesso."]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}



?>