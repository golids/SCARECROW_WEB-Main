type Props = {
  title: string
  desc: string
}

export default function PageIntro({ title, desc }: Props) {
  return (
    <div className="page-intro">
      <h1>{title}</h1>
      <p>{desc}</p>
    </div>
  )
}