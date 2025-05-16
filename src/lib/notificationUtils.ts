
"use client";

export function showLocalNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) {
    console.warn('Notification API not available. Cannot show notification.');
    return;
  }
  
  if (Notification.permission === 'granted') {
    const options: NotificationOptions = {
      body,
      icon: icon || '/logo.png',
      tag: `mendspace-notification-${Date.now()}` 
    };
    try {
      console.log('Creating local notification with title:', title, 'options:', options);
      const notification = new Notification(title, options);
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus(); 
      };
      notification.onclose = () => {
        console.log('Notification closed');
      };
      notification.onerror = (err) => {
        console.error('Notification error:', err);
      };
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  } else {
    console.log(`Cannot show local notification. Permission is: ${Notification.permission}.`);
  }
}
