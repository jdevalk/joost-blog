---
title: Gravity Forms notification routing with a lookup table
publishDate: 2023-02-16T00:00:00.000Z
excerpt: >-
  I had a need for complex routing of notification messages in Gravity Forms.
  The email could, depending on a dropdown field, go to some 50-60 different
  recipient
categories:
  - WordPress
---
I had a need for complex routing of notification messages in Gravity Forms. The email could, depending on a dropdown field, go to some 50-60 different recipients. So I needed a custom lookup table with notification recipients and a way to look up the recipient based on that dropdown field, without exposing all those recipient emails to the outside world. It turned out to be fairly simple once I knew how to approach it, but I thought I’d blog it to make it easier for everyone.

## Backstory

For my local football club [AWC](https://svawc.nl/), where I’m a volunteer, teams need to be emailed about upcoming games sometimes. Messages range from changing the date of a match, to telling the team that the game has been cancelled, etc. Historically, there’d be one email address for that and someone would manually forward those messages to the right team. As the club currently has some 55 teams, that’s becoming quite a bit of work. So I wanted to see if I could make that a bit simpler.

## The setup

For this setup I’ve used my trusted forms plugin for the last decade, [Gravity Forms](https://www.gravityforms.com/), plus a few other plugins:

- [GP Populate Anything](https://gravitywiz.com/documentation/gravity-forms-populate-anything/) – one of many very useful plugins from GravityWiz.
- [Advanced Custom Fields](https://www.advancedcustomfields.com/) – my go to plugin when I need to create custom fields.
- [Custom Post Type UI](https://wordpress.org/plugins/custom-post-type-ui/) – to lazily create a custom post type.

Now let’s go through the different steps I took for this:

### The notification recipients

First, I created a post type `contact-persons` with “supports” set to `false` (or “none” in Custom Post Type UI), which means that it’ll not have a post editor etc. I then created a field group in Advanced Custom Fields (ACF), with 4 fields: the team name, the contact’s first and last name and an email address. I made sure that field group only showed on the `contact-persons` custom post type:

Now when I edit a contact person, it looks like this:

I created a custom plugin for this setup, which has two functions. One takes care of the form routing, the other one takes care of saving the team name to the `post_title` field. I could have left the Post title on the page, but I feel this is actually a better look for the form in terms of usability. This code is quite simple:

```php
/**
  * Sets the team name as the title of the post type for team-contacts.
  *
  * @see 'save_post'
  *
  * @param int     $post_id The post being saved.
  * @param WP_Post $post.   The post object.
  */
function joost_set_team_name_as_title( $post_id, $post ) {
    // If this is a revision, get real post ID.
    $parent_id = wp_is_post_revision( $post_id );

    if ( false !== $parent_id ) {
        $post_id = $parent_id;
    }

	if ( $post->post_type !== 'team-contacts' ) {
		return;
	}
	
    // Unhook this function so it doesn't loop infinitely.
    remove_action( 'save_post', 'joost_set_team_name_as_title' );

    // Update the post, which calls save_post again.
  	$team_name = get_field( 'team_naam', $post_id );
	wp_update_post( [ 'ID' => $post_id, 'post_title' => $team_name ] );

    // Re-hook this function.
    add_action( 'save_post', 'joost_set_team_name_as_title' );
}
add_action( 'save_post', 'joost_set_team_name_as_title', 10, 2 );
```

### The form

I built a contact form in Gravity Forms, just the way one normally would, and added on field to the very top: Which team do you want to send this message to? This field is a drop down, which I set to “Populate choices dynamically”, using the GP Populate Anything plugin. That field then takes the teams from the newly created custom post type and lists them here:

As value, I kept the Post ID, because we’re going to use that in our second custom function, which does the routing. I hooked this to the generic `gform_notification` filter and decided to check if the notification name matched what I used. You can also use a more specific filter, but this was easy enough for my use case:

```php
/**
 * Filter the notification recipient to the right team, if this is a team notification.
 *
 * @param array $notification The notification array.
 * @param array $form         Not used.
 * @param array $entry        The entry array.
 *
 * @return array The notification array.
 */
function joost_notification_emails_team( $notification, $form, $entry ) {
    // Only change notification to address for team notifications.
    if ( $notification['name'] == 'Team notification' ) {
 
        $field_id = 1; // The ID of the team select field.
 		$post_id  = rgar( $entry, $field_id );
		
        $notification['to'] = get_field( 'email', $post_id );
    }
 
    return $notification;
}

add_filter( 'gform_notification', 'joost_notification_emails_team', 10, 3 );
```

### The notification

Now we need to create our notification. It’s as simple as creating a notification that looks the way you want it to. You can add *any* email in the To field, as it’ll be replaced by the code above anyway. The only thing that’s important is that you give the notification the same name as you’ve used in the code above.

That’s it! Now you’ve got a working team contact form, where if you add teams, they show up in the drop down and the right contact person receives the email based on your “lookup table” post type. Notification routing done right!

## Bonus points

### Disable Custom Post Type UI

One of the things I absolutely *love* about the Custom Post Type UI setting is its export functionality. Under CPT UI → Tools → Get Code, it gives you the function to register your post type. Copy paste that code to your custom plugin and voila: you can disable Custom Post Type UI.

### Create a better overview page

On the overview page, you’d see the team name and the date it was published. Not very useful. We can change that to: team name, contact name, contact email, and remove the date, with the following custom code:

```php
/**
 * Register columns for the edit contact persons overview page.
 * 
 * @param array $columns The existing columns.
 *
 * @return array The filtered columns.
 */ 
function joost_add_team_contact_columns( $columns ) {
	$columns['contact-name']  = 'Contact name';
	$columns['contact-email'] = 'Email';

	unset( $columns['date'] );

	return $columns;
}

// Register the columns, specifically for our custom post type.
add_filter( 'manage_team-contacts_posts_columns', 'joost_add_team_contact_columns' );

/**
 * Output the column values.
 * 
 * @param string $column_name The name of the column.
 * @param int    $post_id     The post ID.
 */
function joost_team_contacts_column_content( $column_name, $post_id ) {
	if ( $column_name === 'contact-name' ) {
		echo get_field( 'voornaam', $post_id ) . ' ' . get_field( 'achternaam', $post_id );
	}
	if ( $column_name === 'contact-email' ) {
		printf( '<a href="mailto:%1$s">%1$s</a>', get_field( 'email', $post_id ) );
	}
}

// Handle the value for each of the new columns, only on this post type. 
add_action( 'manage_team-contacts_posts_custom_column', 'joost_team_contacts_column_content', 10, 2 );
```

So, now we have a Gravity form with notifications routing, a management interface for teams and their contact persons and as you add teams or change contacts, the form updates dynamically and keeps sending notifications to the right people. Thanks to the various people in [Post Status](https://poststatus.com/)‘ #club channel that helped out with their suggestions!
