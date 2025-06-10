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
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id_formulario']) || !isset($data['titulo_formulario']) || !isset($data['descricao_formulario']) || !isset($data['perguntas'])) {
    echo json_encode(['erro' => 'Dados incompletos']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Atualizar título e descrição do formulário
    $stmt = $pdo->prepare("UPDATE form SET titulo = ?, descricao = ? WHERE id = ?");
    $stmt->execute([$data['titulo_formulario'], $data['descricao_formulario'], $data['id_formulario']]);

    // Apagar perguntas e alternativas existentes
    $stmt = $pdo->prepare("DELETE FROM alternative WHERE id_pergunta IN (SELECT id FROM question WHERE id_formulario = ?)");
    $stmt->execute([$data['id_formulario']]);

    $stmt = $pdo->prepare("DELETE FROM question WHERE id_formulario = ?");
    $stmt->execute([$data['id_formulario']]);

    /* Inserir novas perguntas e alternativas
    foreach ($data['perguntas'] as $pergunta) {
        $stmt = $pdo->prepare("INSERT INTO question (id_formulario, texto, tipo, obrigatoria) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['id_formulario'], $pergunta['texto'], $pergunta['tipo'], $pergunta['obrigatoria']]);

        $idPergunta = $pdo->lastInsertId();

        if (!empty($pergunta['alternativas'])) {
            foreach ($pergunta['alternativas'] as $alt) {
                $stmt = $pdo->prepare("INSERT INTO alternative (id_pergunta, texto) VALUES (?, ?)");
                $stmt->execute([$idPergunta, $alt['texto_alternative']]);
            }
        }
    }
    */
    $pdo->commit();
    echo json_encode(['sucesso' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['erro' => $e->getMessage()]);
}

?>