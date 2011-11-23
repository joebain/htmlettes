<?php
$link = mysql_connect("localhost", "klik53_user", "glorious");
$db = mysql_select_db("klik53", $link);
$time = $_GET["time"];
$name = $_GET["name"];
if ($name != null && $time != null) {
  $sql = 'INSERT INTO scores (time, name) values(' . $time . ',"' . $name . '");';
  $result = mysql_query($sql, $link);
  if (!$result) {
    echo "Could not successfully run query ($sql) from DB: " . mysql_error();
    exit;
  }
}

$sql = 'SELECT name, time FROM scores ORDER BY time DESC LIMIT 20;';
$result = mysql_query($sql, $link);
if (!$result) {
  echo "Could not successfully run query ($sql) from DB: " . mysql_error();
  exit;
}
if (mysql_num_rows($result) == 0) {
  echo "No rows found, nothing to print so am exiting";
  exit;
}
echo "[";
$first = true;
while ($row = mysql_fetch_assoc($result)) {
  if ($first) {
    echo "{";
    $first = false;
  }
  else {
    echo ",{";
  }
  echo '"name": "' . $row["name"] . '", ';
  echo '"time": "' . $row["time"] . '"';
  echo "}";
}
echo "]";

?>
