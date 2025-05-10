<?php
$xmlStr = $_POST['xml'];
file_put_contents('productos.xml', $xmlStr);
echo 'XML actualizado';
?>