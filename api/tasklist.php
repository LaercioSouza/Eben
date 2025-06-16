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
    t.responsavel,
    t.tempo_sugerido,
    t.data_tarefa,
    t.hora_tarefa,
    t.descricao,
    t.coordenadas,
    t.status,
    t.criado_em
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
$campos_esperados = [
    'empresa', 'colaborador', 'id', 'responsavel', 'tempo_sugerido', 'data_tarefa',
    'hora_tarefa', 'descricao', 'coordenadas', 'status', 'criado_em'
];

foreach ($resultados as &$registro) {
    foreach ($campos_esperados as $campo) {
        if (!array_key_exists($campo, $registro)) {
            $registro[$campo] = null;
        }
    }
}

echo json_encode($resultados, JSON_UNESCAPED_UNICODE);


// Retorna como JSON


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




