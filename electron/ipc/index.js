export const secureChannels = {
  send: ['agent:context', 'agent:update', 'window-drag', 'window-snap', 'notification:add', 'request-context'],
  receive: ['agent:event', 'agent:status']
};

export const isAllowedChannel = (channel) =>
  secureChannels.send.includes(channel) || secureChannels.receive.includes(channel);
