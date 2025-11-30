export const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return
  }
  const date = new Date(timestamp)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const formattedString = formatter.format(date)

  return formattedString
}
