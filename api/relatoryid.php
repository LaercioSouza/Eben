<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

// Dados do banco
$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()]);
    exit;
}

// Recebe os dados JSON do frontend
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID da tarefa não fornecido']);
    exit;
}

$taskId = $data['id'];

try {
    // Busca tarefa
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            c.nome AS company_nome,
            e.nome AS employee_nome,
            TIME_FORMAT(t.workTime, '%H:%i:%s') AS workTime
        FROM task t
        JOIN companies c ON t.empresa_id = c.id
        JOIN employees e ON t.colaborador_id = e.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Tarefa não encontrada']);
        exit;
    }

    $response = [
        'company' => ['nome' => $task['company_nome']],
        'employee' => ['nome' => $task['employee_nome']],
        'task' => [
            'id' => $task['id'],
            'responsavel' => $task['responsavel'],
            'tempo_sugerido' => $task['tempo_sugerido'],
            'data_tarefa' => $task['data_tarefa'],
            'hora_tarefa' => $task['hora_tarefa'],
            'descricao' => $task['descricao'],
            'status' => $task['status'],
            'workTime' => $task['workTime'] // Novo campo adicionado
        ]
    ];


    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
}


?>