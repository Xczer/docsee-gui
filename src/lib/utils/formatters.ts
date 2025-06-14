// Formatting utilities

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  if (unitIndex === 0) {
    return `${bytes} ${units[unitIndex]}`;
  } else {
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) {
    return 'just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diff < 2592000) { // 30 days
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diff < 31536000) { // 365 days
    const months = Math.floor(diff / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diff / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function parseImageTag(image: string): { name: string; tag: string } {
  const lastColonIndex = image.lastIndexOf(':');
  if (lastColonIndex === -1) {
    return { name: image, tag: 'latest' };
  }
  
  const name = image.slice(0, lastColonIndex);
  const tag = image.slice(lastColonIndex + 1);
  
  return { name, tag };
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

export function getContainerDisplayName(container: { names: string[]; id: string }): string {
  if (container.names && container.names.length > 0) {
    // Remove leading slash from container names
    return container.names[0].replace(/^\//, '');
  }
  return truncateString(container.id, 12);
}

export function getContainerStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-green-600 bg-green-100';
    case 'exited':
      return 'text-gray-600 bg-gray-100';
    case 'paused':
      return 'text-yellow-600 bg-yellow-100';
    case 'restarting':
      return 'text-blue-600 bg-blue-100';
    case 'removing':
    case 'dead':
      return 'text-red-600 bg-red-100';
    case 'created':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getImageDisplayName(image: string): string {
  const { name, tag } = parseImageTag(image);
  return `${name}:${tag}`;
}

// Container port formatting
export function formatContainerPorts(ports: Array<{ private_port: number; public_port?: number; type: string; ip?: string }>): string {
  if (!ports || ports.length === 0) {
    return 'None';
  }
  
  return ports
    .map(port => {
      if (port.public_port) {
        const ip = port.ip && port.ip !== '0.0.0.0' ? `${port.ip}:` : '';
        return `${ip}${port.public_port}:${port.private_port}/${port.type}`;
      } else {
        return `${port.private_port}/${port.type}`;
      }
    })
    .join(', ');
}

// CPU percentage calculation
export function calculateCpuPercent(current: any, previous: any): number {
  if (!current?.cpu_stats || !previous?.precpu_stats) {
    return 0;
  }
  
  const cpuDelta = current.cpu_stats.cpu_usage.total_usage - previous.precpu_stats.cpu_usage.total_usage;
  const systemDelta = current.cpu_stats.system_cpu_usage - previous.precpu_stats.system_cpu_usage;
  const onlineCpus = current.cpu_stats.online_cpus || 1;
  
  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * onlineCpus * 100;
  }
  
  return 0;
}

// Memory percentage calculation
export function calculateMemoryPercent(stats: any): number {
  if (!stats?.memory_stats?.usage || !stats?.memory_stats?.limit) {
    return 0;
  }
  
  return (stats.memory_stats.usage / stats.memory_stats.limit) * 100;
}

// Network I/O calculation
export function calculateNetworkIO(stats: any): { rx: number; tx: number } {
  if (!stats?.networks) {
    return { rx: 0, tx: 0 };
  }
  
  let totalRx = 0;
  let totalTx = 0;
  
  Object.values(stats.networks).forEach((network: any) => {
    totalRx += network.rx_bytes || 0;
    totalTx += network.tx_bytes || 0;
  });
  
  return { rx: totalRx, tx: totalTx };
}

// Block I/O calculation
export function calculateBlockIO(stats: any): { read: number; write: number } {
  if (!stats?.blkio_stats?.io_service_bytes_recursive) {
    return { read: 0, write: 0 };
  }
  
  let totalRead = 0;
  let totalWrite = 0;
  
  stats.blkio_stats.io_service_bytes_recursive.forEach((item: any) => {
    if (item.op === 'Read') {
      totalRead += item.value || 0;
    } else if (item.op === 'Write') {
      totalWrite += item.value || 0;
    }
  });
  
  return { read: totalRead, write: totalWrite };
}
