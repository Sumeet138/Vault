import ActivityList from "./ActivityList";

export default function ActivitiesIndex() {
  return (
    <div className="w-full max-w-lg mx-auto relative md:py-3 mb-[10rem] pt-5">
      <div className="pb-[10rem]">
        <ActivityList dateGrouping={true} />
      </div>
    </div>
  );
}
