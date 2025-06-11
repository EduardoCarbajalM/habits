<?php
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Exception\DynamoDbException;

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000' // Tu instancia local
]);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo "Faltan campos.";
        exit;
    }

    try {
        $client->putItem([
            'TableName' => 'Usuarios',
            'Item' => [
                'email' => ['S' => $email],
                'password' => ['S' => $password]
            ]
        ]);
        echo "Usuario registrado correctamente.";
    } catch (DynamoDbException $e) {
        echo "Error: " . $e->getMessage();
    }
} else {
    echo "Método no permitido.";
}
?>
