<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$itemId = $data['itemId'] ?? null;
$userRating = $data['rating'] ?? null;

if (!$itemId || !$userRating) {
  echo json_encode(['success' => false, 'error' => 'Invalid data']);
  exit;
}

$portfolio = json_decode(file_get_contents('../data/portfolio.json'), true);

// Find item and update votes
foreach ($portfolio as &$item) {
  if ($item['id'] === $itemId) {
    if (!isset($item['votes'])) {
      $item['votes'] = ['average' => 0, 'count' => 0];
    }
    
    $current = $item['votes'];
    $newCount = $current['count'] + 1;
    $newAverage = ($current['average'] * $current['count'] + $userRating) / $newCount;
    
    $item['votes'] = [
      'average' => $newAverage,
      'count' => $newCount
    ];
    
    file_put_contents('../data/portfolio.json', json_encode($portfolio, JSON_PRETTY_PRINT));
    echo json_encode([
      'success' => true,
      'newAverage' => $newAverage,
      'newCount' => $newCount
    ]);
    exit;
  }
}

echo json_encode(['success' => false, 'error' => 'Item not found']);