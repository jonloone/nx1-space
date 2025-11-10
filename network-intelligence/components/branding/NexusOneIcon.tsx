/**
 * NexusOne Icon (Logo Mark Only)
 *
 * Icon-only version of the NexusOne logo for use in compact spaces
 * like avatars, buttons, and headers.
 */

export default function NexusOneIcon({
  className = "",
  size = 20
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main chevron */}
      <path
        d="M13.1202 -2.26724e-06L26.2404 13.1202L13.1202 26.2404L7.28914 20.4093L14.5783 13.1202L7.28914 5.83105L13.1202 -2.26724e-06ZM18.9519 13.1202L11.6627 20.4093L13.1202 21.8668L21.8668 13.1202L13.1202 4.37361L11.6627 5.83105L18.9519 13.1202Z"
        fill="#080C16"
      />
      {/* Medium chevron */}
      <path
        d="M11.8082 13.1202L5.90409 19.0243L3.93596 17.0562L7.87192 13.1202L3.93596 9.18424L5.90409 7.21611L11.8082 13.1202Z"
        fill="#080C16"
      />
      {/* Small chevron */}
      <path
        d="M2.62403 10.4962L5.24806 13.1202L2.62403 15.7442L1.31202 14.4322L2.62403 13.1202L1.31202 11.8082L2.62403 10.4962Z"
        fill="#080C16"
      />
    </svg>
  )
}
