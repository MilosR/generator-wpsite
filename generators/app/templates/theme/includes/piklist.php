<?php


/**
 * Piklist Configuration - Hide for template option
 */

add_filter('piklist_part_data', function ($data, $folder){

    // If not a Meta-box section than bail
    if ($folder != 'meta-boxes') {
        return $data;
    }

    // Allow Piklist to read our custom comment block attribute: "Hide for Template", and set it to hide_for_template
    $data['hide_for_template'] = 'Hide for Template';

    return $data;
}, 10, 2);

/**
 * Piklist Configuration - Hide for template option
 */
add_filter('piklist_part_process_callback', function($part, $type){

    global $post;

    // If not a meta box than bail
    if ($type != 'meta-boxes') {
        return $part;
    }


    // Check if any page template is set in the comment block
    if (!empty($part['data']['hide_for_template'])) {

        // Get the active page template
        $active_template = pathinfo(get_page_template_slug($post->ID), PATHINFO_FILENAME);

        $active_template = empty($active_template) ? 'default' : $active_template;

        // Does the active page template match what we want to hide?
        if (strpos($part['data']['hide_for_template'], $active_template) !== false) {

            // Change meta-box access to user role: no-role
            $part['data']['role'] = 'no-role';
        }
    }
    return $part;
}, 10, 2);


/**
 * Example of Piklist settings page
 */

// add_filter('piklist_admin_pages', function($pages)
// {
//     $pages[] = array(
//         'page_title' => 'Example Title',
//         'menu_title' => 'Example Menu Title',
//         'sub_menu' => 'themes.php',
//         'capability' => 'edit_pages',
//         'menu_slug' => 'theme-settings',
//         'setting' => 'theme-settings',
//         'single_line' => true,
//         'default_tab' => 'Basic',
//         'save_text' => 'Save'
//     );
//
//     return $pages;
// });
//
// add_filter('option_page_capability_theme-settings', function($capability) {
//     return 'edit_pages';
// });