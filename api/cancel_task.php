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
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);
date_default_timezone_set('America/Sao_Paulo');

try {
    $input = json_decode(file_get_contents("php://input"), true);

    $taskId      = $input['taskId'] ?? null;
    $newStatus   = $input['newStatus'] ?? null;
    $endTime     = $input['endTime'] ?? null;
    $coordinates = $input['coordinates'] ?? null;
    $reason      = $input['reason'] ?? null; // minúsculo
    $photoBase64 = $input['photo'] ?? null;

    if (!$taskId || !$reason) {
        echo json_encode(["success" => false, "message" => "Dados insuficientes."]);
        exit;
    }

    $pdo->beginTransaction();
    $pdo->exec("SET time_zone = '-03:00'");

    // Diretório para salvar fotos
    $uploadDir = __DIR__ . "/uploads/cancellations/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $photoFileName = null;
    if ($photoBase64) {
        // Remove prefixo "data:image/jpeg;base64," ou similar
        $photoBase64 = preg_replace('#^data:image/\w+;base64,#i', '', $photoBase64);
        $photoData = base64_decode($photoBase64);

        if ($photoData !== false) {
            $photoFileName = "cancel_" . $taskId . "_" . time() . ".jpg";
            file_put_contents($uploadDir . $photoFileName, $photoData);
        }
    }

    // Atualiza tarefa
    $sql = "UPDATE task 
            SET 
                status = :status,
                cancellation_timestamp = :endTime,
                cancellation_reason = :reason,
                cancellation_coordinates = :coordinates,
                cancellation_photo = :photo
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(":status", $newStatus);
    $stmt->bindValue(":endTime", $endTime ?: date('Y-m-d H:i:s'));
    $stmt->bindValue(":reason", $reason);
    $stmt->bindValue(":coordinates", $coordinates ?? '');
    $stmt->bindValue(":photo", $photoFileName);
    $stmt->bindValue(":id", $taskId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        throw new Exception("Nenhuma linha foi alterada. Verifique se o ID existe e se os valores são diferentes dos atuais.");
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Tarefa cancelada com sucesso.",
        "photo"   => $photoFileName
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
