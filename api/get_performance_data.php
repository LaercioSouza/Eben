<?php 
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}

// --- Recebe filtros do front ---
$dateFilter = $_GET['date'] ?? null;
$statusFilter = $_GET['status'] ?? null;
$empresaId   = $_GET['empresaId'] ?? null;

$where = [];
$params = [];

// Filtro por data
if (!empty($dateFilter)) {
    $where[] = "t.data_tarefa = :dateFilter";
    $params[':dateFilter'] = $dateFilter;
}

// Filtro por status
$statusMap = [
    "pending"     => "pendente",
    "in_progress" => "em_andamento",
    "completed"   => "concluida",
    "canceled"    => "cancelada"
];
if (!empty($statusFilter) && $statusFilter !== "all") {
    $statusDb = $statusMap[$statusFilter] ?? $statusFilter;
    $where[] = "t.status = :statusFilter";
    $params[':statusFilter'] = $statusDb;
}

// Filtro por empresa
if (!empty($empresaId)) {
    $where[] = "t.empresa_id = :empresaId";
    $params[':empresaId'] = $empresaId;
}

$whereSql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

try {
    $stmt = $pdo->prepare("
        SELECT 
            t.status,
            t.workTime,
            t.tempo_sugerido,
            t.transitTime
        FROM task t
        $whereSql
    ");
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$tasks) {
        echo json_encode(['error' => 'Nenhuma tarefa encontrada']);
        exit;
    }

    $completedTasks = array_filter($tasks, fn($task) => $task['status'] === 'concluida');
    $totalTasks = count($tasks);

    // --- Cálculos ---
    $avgWorkTime = calcularMediaTempo($completedTasks, 'workTime');
    $avgTransitTime = calcularMediaTempo($completedTasks, 'transitTime');

    $performances = [];
    $efficiencyCount = 0;
    $wastePercentages = [];

    foreach ($completedTasks as $task) {
        if (!empty($task['tempo_sugerido']) && !empty($task['workTime'])) {
            $sugerido = tempoParaSegundos($task['tempo_sugerido']);
            $real = tempoParaSegundos($task['workTime']);
            if ($sugerido > 0 && $real > 0) {
                // Limita a performance individual a 100%
                $performance = min(100, ($sugerido / $real) * 100);
                $performances[] = $performance;

                // Contagem de eficiência
                if ($performance >= 100) {
                    $efficiencyCount++;
                }

                // Desperdício consistente com gráfico individual
                $wastePercentages[] = max(0, 100 - $performance);
            }
        }
    }

    $avgPerformance = count($performances) > 0 ? round(array_sum($performances) / count($performances), 2) : 0;
    $avgWaste = count($wastePercentages) > 0 ? round(array_sum($wastePercentages) / count($wastePercentages), 2) : 0;
    $avgSuggested = calcularMediaTempo($completedTasks, 'tempo_sugerido');
    $avgReal = calcularMediaTempo($completedTasks, 'workTime');

    echo json_encode([
        'completedTasks' => count($completedTasks),
        'totalTasks' => $totalTasks,
        'avgWorkTime' => $avgWorkTime,
        'avgTransitTime' => $avgTransitTime,
        'avgPerformance' => $avgPerformance,
        'efficiency' => $efficiencyCount,
        'waste' => $avgWaste,
        'avgSuggested' => $avgSuggested,
        'avgReal' => $avgReal
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => 'Erro ao buscar dados: ' . $e->getMessage()]);
}

function calcularMediaTempo($tasks, $campo) {
    $totalSegundos = 0;
    $count = 0;
    foreach ($tasks as $task) {
        if (!empty($task[$campo])) {
            $totalSegundos += tempoParaSegundos($task[$campo]);
            $count++;
        }
    }
    return $count > 0 ? round(($totalSegundos / $count) / 3600, 2) : 0; // em horas
}

function tempoParaSegundos($tempo) {
    $parts = explode(':', $tempo);
    return ($parts[0] * 3600) + ($parts[1] * 60) + $parts[2];
}
