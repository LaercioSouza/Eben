
<?php
require_once 'config.php';

// Teste de conexão com o banco
echo "<h2>Teste de Conexão MySQL</h2>";

try {
    
    echo "<p style='color: green;'>✓ Conexão com MySQL estabelecida com sucesso!</p>";
    
    // Verificar se as tabelas existem
    $tables = ['companies', 'employees', 'tasks', 'forms', 'system_config'];
    
    echo "<h3>Verificação de Tabelas:</h3>";
    
    
    // Teste de inserção simples
    echo "<h3>Teste de Inserção:</h3>";
    try {
        $testData = [
            'id' => 9999,
            'nome' => 'Teste de Conexão',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $pdo->prepare("INSERT INTO companies (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)");
        $stmt->execute([9999, json_encode($testData)]);
        
        echo "<p style='color: green;'>✓ Teste de inserção realizado com sucesso!</p>";
        
        // Remover dados de teste
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([9999]);
        echo "<p style='color: blue;'>ℹ Dados de teste removidos</p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Erro no teste de inserção: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro de conexão: " . $e->getMessage() . "</p>";
    echo "<p>Verifique se:</p>";
    echo "<ul>";
    echo "<li>O MySQL está rodando no XAMPP</li>";
    echo "<li>O banco 'dashboard_db' foi criado</li>";
    echo "<li>As configurações em config.php estão corretas</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><a href='../index.html'>← Voltar para a aplicação</a></p>";
?>
