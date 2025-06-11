<?php
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

$result = $client->scan([
    'TableName' => 'Usuarios'
]);

echo "<h2>Usuarios registrados:</h2>";
foreach ($result['Items'] as $item) {
    echo "<p>" . $item['email']['S'] . "</p>";
}
?>
