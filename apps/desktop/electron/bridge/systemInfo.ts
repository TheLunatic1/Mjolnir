import os from 'os';

// Inline types to avoid workspace alias resolution issues in electron context
interface NetworkInterface {
  name: string;
  address: string;
  family: 'IPv4' | 'IPv6';
  internal: boolean;
}

interface SystemInfo {
  cpuModel: string;
  cpuCores: number;
  cpuThreads: number;
  cpuSpeedMhz: number;
  totalRamMb: number;
  freeRamMb: number;
  platform: string;
  arch: string;
  osRelease: string;
  hostname: string;
  networkInterfaces: NetworkInterface[];
  uptimeSeconds: number;
}

export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const netInterfaces = os.networkInterfaces();

  const networkInterfaceList: NetworkInterface[] = [];
  for (const [name, addrs] of Object.entries(netInterfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      networkInterfaceList.push({
        name,
        address: addr.address,
        family: addr.family as 'IPv4' | 'IPv6',
        internal: addr.internal,
      });
    }
  }

  // Filter to only non-internal IPv4 interfaces for display
  const externalInterfaces = networkInterfaceList.filter(
    (iface) => !iface.internal && iface.family === 'IPv4'
  );

  const primaryCpu = cpus[0];
  const cpuModel = primaryCpu?.model?.trim() ?? 'Unknown CPU';
  const cpuSpeedMhz = primaryCpu?.speed ?? 0;
  const cpuCores = cpus.length > 0 ? Math.max(1, Math.floor(cpus.length / 2)) : 1; // Physical cores estimate
  const cpuThreads = cpus.length;

  return {
    cpuModel,
    cpuCores,
    cpuThreads,
    cpuSpeedMhz,
    totalRamMb: Math.round(totalMem / (1024 * 1024)),
    freeRamMb: Math.round(freeMem / (1024 * 1024)),
    platform: os.platform(),
    arch: os.arch(),
    osRelease: os.release(),
    hostname: os.hostname(),
    networkInterfaces: externalInterfaces.length > 0 ? externalInterfaces : networkInterfaceList.slice(0, 3),
    uptimeSeconds: Math.round(os.uptime()),
  };
}
