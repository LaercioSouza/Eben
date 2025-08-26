<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}
    try{
    // Buscar tarefas do banco
    $stmt = $pdo->query("
        SELECT 
            status,
            workTime,
            transitTime
        FROM task
        
    ");
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$tasks) {
        echo json_encode(['error' => 'Nenhuma tarefa encontrada']);
        exit;
    }

    // Processar dados
    $completedTasks = array_filter($tasks, fn($task) => $task['status'] === 'concluida');
    $totalTasks = count($tasks);
    
    // Calcular médias de tempo
    $avgWorkTime = calcularMediaTempo($completedTasks, 'workTime');
    $avgTransitTime = calcularMediaTempo($completedTasks, 'transitTime');

    // Retornar resposta
    echo json_encode([
        'completedTasks' => count($completedTasks),
        'totalTasks' => $totalTasks,
        'avgWorkTime' => $avgWorkTime,
        'avgTransitTime' => $avgTransitTime
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => 'Erro ao buscar dados: ' . $e->getMessage()]);
}

function calcularMediaTempo($tasks, $campo) {
    $totalSegundos = 0;
    $count = 0;

    foreach ($tasks as $task) {
        if (!empty($task[$campo])) {
            $parts = explode(':', $task[$campo]);
            $totalSegundos += ($parts[0] * 3600) + ($parts[1] * 60) + $parts[2];
            $count++;
        }
    }

    return $count > 0 ? round(($totalSegundos / $count) / 3600, 2) : 0; // Retorna em horas
}

?>