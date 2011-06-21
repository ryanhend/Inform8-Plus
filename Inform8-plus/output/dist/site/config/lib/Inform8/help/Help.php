<?php
class Help {
    public static function getHelp($name, $id, $lang) {
        if ($lang->get($name) != $name) {
            return '';
        } else {
            return "<img style=\"padding-left:8px\" id=\"edit-$id\" title=\"" . $lang->get($name) . "\" src=\"images/help_inline.png\" /><script type=\"text/javascript\">$('#edit-$id').hoverbox();</script>";
        }
    }
}
?>