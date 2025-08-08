import React from 'react'
import { useConnect, useConnectors } from 'wagmi'

export function Connect() {
  const { connect } = useConnect()
  const connectors = useConnectors()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {connectors?.map((connector) => (
        <button key={connector.uid} onClick={() => connect({ connector })}>
          Connect ({connector.name})
        </button>
      ))}
    </div>
  )
}


