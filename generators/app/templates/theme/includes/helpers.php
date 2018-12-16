<?php

/**
 * @param $link
 * @param string $append
 * @param array $allowed
 * @return string
 */
function httpify($link, $append = 'http://', $allowed = array('http://', 'https://'))
{

    $found = false;
    foreach ($allowed as $protocol)
        if (strpos($link, $protocol) !== 0)
            $found = true;

    if ($found)
        return $link;

    return $append . $link;
}


/**
 * Get YT video id from url
 *
 * Supported url formats -
 *
 * http://youtu.be/1111111111 ...
 * http://www.youtube.com/embed/1111111111 ...
 * http://www.youtube.com/watch?v=1111111111 ...
 * http://www.youtube.com/?v=1111111111 ...
 *
 * @param string $url The URL
 *
 * @return string the video id extracted from url
 */

function parse_yt_video_id($url)
{

    parse_str(parse_url($url, PHP_URL_QUERY), $my_array_of_vars);
    return isset($my_array_of_vars['v']) ?
        $my_array_of_vars['v'] :
        (isset($my_array_of_vars['watch']) ? $my_array_of_vars['watch'] : null);

}

/**
 * Get Vimeo video id from url
 *
 * Supported url formats -
 *
 * https://vimeo.com/11111111
 * http://vimeo.com/11111111
 * https://www.vimeo.com/11111111
 * http://www.vimeo.com/11111111
 * https://vimeo.com/channels/11111111
 * http://vimeo.com/channels/11111111
 * https://vimeo.com/groups/name/videos/11111111
 * http://vimeo.com/groups/name/videos/11111111
 * https://vimeo.com/album/2222222/video/11111111
 * http://vimeo.com/album/2222222/video/11111111
 * https://vimeo.com/11111111?param=test
 * http://vimeo.com/11111111?param=test
 *
 * @param string $url The URL
 *
 * @return string the video id extracted from url
 */

function parse_vimeo_video_id($url)
{

    if (preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $url, $regs)) {
        return $regs[3];
    }

    return null;
}