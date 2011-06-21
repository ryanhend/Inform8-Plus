<?php
class Tabs {

    public static function viewInTab($action, $object, $id, $linkText, $tabTitle) {
        return '<a href="" ' .
        'onclick="javascript:updateTab(\'ajax.php? ' .
        'action=' . $action .
        '&object=' . $object .
        '&id=' . $id .
        '\', \'' . $tabTitle . '\'); return false;">' . $linkText . '</a>';
    
    }
    
    public static function viewInNewTab($action, $object, $id, $linkText, $tabTitle) {
        return '<a href="" ' .
        'onclick="' . Tabs::viewInNewTabJs($action, $object, $id, $tabTitle) . ' return false;">' . $linkText . '</a>';
    
    }
    
    public static function viewInNewTabJs($action, $object, $id, $tabTitle) {
        return 'javascript:newTab(\'ajax.php? ' .
        'action=' . $action .
        '&object=' . $object .
        '&id=' . $id .
        '\', \'' . $tabTitle . '\');';
    
    }

}
?>