<?php
// Minimal PHP proxy for Google Gemini API
// Expects JSON: { "messages": [ { role: "user"|"model", content: "..." }, ... ] }
// Returns JSON: { reply: string, raw: object }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Load API key from environment or local file (not committed)
$apiKey = getenv('GEMINI_API_KEY');
if (!$apiKey) {
    $envPath = __DIR__ . '/.env.local';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2 && trim($parts[0]) === 'GEMINI_API_KEY') {
                $apiKey = trim($parts[1]);
                break;
            }
        }
    }
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode([ 'error' => 'Missing GEMINI_API_KEY. Set env or blog/blog-using-php-mysql/.env.local' ]);
    exit;
}

$input = file_get_contents('php://input');
if (!$input) {
    http_response_code(400);
    echo json_encode([ 'error' => 'Empty body' ]);
    exit;
}

$payload = json_decode($input, true);
if ($payload === null) {
    http_response_code(400);
    echo json_encode([ 'error' => 'Invalid JSON' ]);
    exit;
}

$messages = isset($payload['messages']) ? $payload['messages'] : null;
if (!is_array($messages) || count($messages) === 0) {
    http_response_code(400);
    echo json_encode([ 'error' => 'messages must be a non-empty array' ]);
    exit;
}

// Convert messages to Gemini prompt format
// Using Generative Language API v1beta streaming disabled; model: gemini-1.5-flash
$model = isset($payload['model']) ? $payload['model'] : 'gemini-1.5-flash';
$systemInstruction = isset($payload['system']) ? $payload['system'] : null;

$contents = [];
foreach ($messages as $msg) {
    if (!isset($msg['role']) || !isset($msg['content'])) continue;
    $role = $msg['role'] === 'user' ? 'user' : 'model';
    $contents[] = [
        'role' => $role,
        'parts' => [ [ 'text' => (string)$msg['content'] ] ],
    ];
}

$body = [
    'contents' => $contents,
];
if ($systemInstruction) {
    $body['systemInstruction'] = [ 'parts' => [ [ 'text' => $systemInstruction ] ] ];
}

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . urlencode($model) . ':generateContent?key=' . urlencode($apiKey);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [ 'Content-Type: application/json' ]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
if ($response === false) {
    $err = curl_error($ch);
    curl_close($ch);
    http_response_code(500);
    echo json_encode([ 'error' => 'cURL error', 'details' => $err ]);
    exit;
}

$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$json = json_decode($response, true);
if ($status < 200 || $status >= 300) {
    http_response_code($status);
    echo json_encode([ 'error' => 'Upstream error', 'status' => $status, 'raw' => $json ]);
    exit;
}

$replyText = '';
if (isset($json['candidates'][0]['content']['parts'])) {
    $parts = $json['candidates'][0]['content']['parts'];
    foreach ($parts as $part) {
        if (isset($part['text'])) { $replyText .= $part['text']; }
    }
}

echo json_encode([
    'reply' => $replyText,
    'raw' => $json,
]);
?>

