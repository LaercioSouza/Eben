<?php
// Configurações do banco de dados
$host = 'localhost';     // Ou o IP do servidor MySQL
$usuario = 'root'; // Substitua por seu usuário do MySQL
$senha = '';     // Substitua pela senha do MySQL
$banco = 'mydb';          // Nome do banco de dados

// Cria conexão
$conn = new mysqli($host, $usuario, $senha, $banco);

// Verifica se houve erro na conexão
if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

echo "Conexão bem-sucedida!";
?>
