<?php
/**
 * Created by PhpStorm.
 * User: hao
 * Date: 17-3-24
 * Time: 下午4:07
 */
$STR_FILE = "file";
var_dump($_FILES[$STR_FILE]);
$target_path = "uploads/";

$target_path = $target_path . basename( $_FILES[$STR_FILE]['name']);

if(move_uploaded_file($_FILES[$STR_FILE]['tmp_name'], $target_path)) {
    echo "The file ".  basename( $_FILES[$STR_FILE]['name']).
        " has been uploaded";
} else{
    echo "There was an error uploading the file, please try again!";
}