<script lang="ts">
    // Define the props
    export let status: 'online' | 'offline' | 'busy' | 'away';
  
    // Define the status colors mapping
    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-500',
      busy: 'bg-red-500',
      away: 'bg-yellow-500'
    };
  </script>
  
  <!-- Component HTML -->
  <span
    class={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${statusColors[status]}`}
  />